import { useState, useEffect } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Building2, RotateCcw, Check, Users, Plus, Trash2, Edit, Loader2, BrainCircuit, Mail, Settings, MessageSquare, Lock, FileText, Calendar, Save, Bell, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTechnicians, Department } from '@/hooks/useTechnicians';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User as UserIcon } from 'lucide-react';

import { AiService } from '@/services/aiService';
import { BrandingService } from '@/services/brandingService';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';

export default function Branding() {
    const {
        primaryColor,
        setPrimaryColor,
        sidebarColor,
        setSidebarColor,
        logoUrl,
        setLogoUrl,
        officeName,
        setOfficeName,
        resetBranding,
        loading: brandingLoading
    } = useBranding();

    const { technicians, loading: techsLoading, addTechnician, updateTechnician, deleteTechnician } = useTechnicians();


    const [isSaving, setIsSaving] = useState(false);
    
    // Branding State
    const [localColor, setLocalColor] = useState(primaryColor);
    const [localSidebarColor, setLocalSidebarColor] = useState(sidebarColor);
    const [localName, setLocalName] = useState(officeName);
    const [localLogo, setLocalLogo] = useState(logoUrl || '');
    
    // Profile State
    const { user } = useAuth();
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');

    // AI Branding State
    const [apiKey, setApiKey] = useState("");
    const [emailSettings, setEmailSettings] = useState({
        headerTitle: '',
        footerText: '',
        buttonText: '',
        replyToEmail: '',
        deliveryEmailSubject: '',
        deliveryEmailBody: ''
    });

    // Technician Form State
    const [newTechName, setNewTechName] = useState('');
    const [newTechDept, setNewTechDept] = useState<Department>('dp');
    const [editingTechId, setEditingTechId] = useState<string | null>(null);

    useEffect(() => {
        if (!brandingLoading) {
            setLocalColor(primaryColor);
            setLocalSidebarColor(sidebarColor);
            setLocalName(officeName);
            setLocalLogo(logoUrl || '');
            
            const savedApiKey = AiService.getApiKey() || "";
            setApiKey(savedApiKey);

            const b = BrandingService.getBranding();
            setEmailSettings({
                headerTitle: b.headerTitle || '',
                footerText: b.footerText || '',
                buttonText: b.buttonText || '',
                replyToEmail: b.replyToEmail || '',
                deliveryEmailSubject: b.deliveryEmailSubject || '',
                deliveryEmailBody: b.deliveryEmailBody || ''
            });
        }
    }, [brandingLoading, primaryColor, sidebarColor, officeName, logoUrl]);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // 1. Save Basic Branding to Context (and Supabase via Context)
            await setPrimaryColor(localColor);
            await setSidebarColor(localSidebarColor);
            await setOfficeName(localName);
            await setLogoUrl(localLogo || null);

            // 2. Save API Key
            AiService.setApiKey(apiKey);

            // 3. Save Email Branding
            const currentBranding = BrandingService.getBranding();
            await BrandingService.saveBranding({
                ...currentBranding,
                primaryColor: localColor,
                sidebarColor: localSidebarColor,
                logoUrl: localLogo,
                officeName: localName,
                companyName: localName,
                ...emailSettings
            });

            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar no servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Deseja resetar para o padrão?")) return;
        await resetBranding();
        toast.info('Configurações resetadas para o padrão.');
    };

    const handleAddTech = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTechName.trim()) return;

        try {
            if (editingTechId) {
                await updateTechnician(editingTechId, newTechName, newTechDept);
                setEditingTechId(null);
            } else {
                await addTechnician(newTechName, newTechDept);
            }
            setNewTechName('');
            toast.success(editingTechId ? 'Responsável atualizado!' : 'Responsável cadastrado!');
        } catch (error) {
            // Error managed by hook
        }
    };

    const startEditTech = (tech: any) => {
        setEditingTechId(tech.id);
        setNewTechName(tech.name);
        setNewTechDept(tech.department);
    };


    const departmentLabels: Record<Department, string> = {
        dp: 'Departamento Pessoal',
        fiscal: 'Departamento Fiscal',
        contabil: 'Departamento Contábil',
        financeiro: 'Departamento Financeiro',
        qualidade: 'Departamento de Qualidade'
    };

    if (brandingLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-slide-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-light tracking-tight text-foreground">Gestão do <span className="text-primary font-normal">Escritório</span></h1>
                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Unificamos Identidade Visual, Inteligência Artificial e Comunicação</p>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50 mb-8 inline-flex h-12 w-fit">
                    <TabsTrigger value="visual" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Palette className="w-4 h-4 mr-2" /> Identidade Visual
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <BrainCircuit className="w-4 h-4 mr-2" /> Inteligência Artificial
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Mail className="w-4 h-4 mr-2" /> E-mails & Entrega
                    </TabsTrigger>
                    <TabsTrigger value="technicians" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Users className="w-4 h-4 mr-2" /> Responsáveis Técnicos
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-xl px-6 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <UserIcon className="w-4 h-4 mr-2" /> Meu Perfil
                    </TabsTrigger>

                </TabsList>

                {/* ABA 1: IDENTIDADE VISUAL */}
                <TabsContent value="visual" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <Palette className="h-5 w-5 text-primary" /> Marca & Cores
                                </CardTitle>
                                <CardDescription className="font-light">Ajuste as cores e logos para criar uma experiência única</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="color" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Cor de Destaque (Principal)</Label>
                                    <div className="flex gap-4">
                                        <input type="color" id="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1" />
                                        <Input value={localColor} onChange={(e) => setLocalColor(e.target.value)} placeholder="#000000" className="font-mono font-light h-10 border-border/50" />
                                    </div>
                                </div>

                                <div className="space-y-2 opacity-50 cursor-not-allowed">
                                    <Label htmlFor="sidebarColor" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Fundo do Menu Lateral (Premium Light Ativo)</Label>
                                    <div className="flex gap-4">
                                        <input type="color" id="sidebarColor" value={localSidebarColor} disabled className="h-10 w-20 cursor-not-allowed rounded-lg border border-border bg-background p-1" />
                                        <Input value={localSidebarColor} disabled placeholder="#FFFFFF" className="font-mono font-light h-10 border-border/50 cursor-not-allowed" />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic">O tema premium está travado em cores claras para garantir a harmonia visual.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Nome do Escritório</Label>
                                    <Input id="name" value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="Ex: Contabilidade Silva" className="font-light h-10 border-border/50" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="logo" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Link da Logo (URL)</Label>
                                    <Input id="logo" value={localLogo} onChange={(e) => setLocalLogo(e.target.value)} placeholder="https://exemplo.com/sua-logo.png" className="font-light h-10 border-border/50" />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button onClick={handleSaveAll} disabled={isSaving} className="flex-1 rounded-xl h-11 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10">
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4 opacity-70" />}
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                    <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 border-border/50 font-light text-xs uppercase tracking-widest">
                                        <RotateCcw className="mr-2 h-4 w-4 opacity-70" /> Resetar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-card bg-muted/5 rounded-2xl overflow-hidden h-fit sticky top-6">
                            <CardHeader className="border-b border-border/30 bg-card/50">
                                <CardTitle className="text-lg font-light tracking-wide">Preview em Tempo Real</CardTitle>
                                <CardDescription className="font-light">Visualize como sua marca aparece no sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="py-12 flex items-center justify-center">
                                <div className="flex w-[300px] h-64 overflow-hidden rounded-xl border border-divider shadow-elevated bg-background">
                                    {/* Sidebar Preview */}
                                    <div className="w-16 h-full flex flex-col border-r border-slate-100 bg-white p-2">
                                        <div className="h-8 w-8 rounded-lg mb-4 self-center shadow-sm" style={{ backgroundColor: localColor }}>
                                            {localLogo ? <img src={localLogo} className="h-full w-full object-contain p-1.5" /> : <Building2 className="h-4 w-4 text-white m-auto mt-2" />}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                                            <div className="h-1.5 w-full bg-primary/10 rounded-full" />
                                            <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>
                                    {/* Content Preview */}
                                    <div className="flex-1 p-6 space-y-4 bg-slate-50">
                                        <div className="space-y-1">
                                            <h1 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{localName || 'JLVIANA'}</h1>
                                            <div className="h-1 w-1/4 bg-slate-200 rounded" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="h-12 bg-white rounded-lg border border-slate-100" />
                                            <div className="h-12 bg-white rounded-lg border border-slate-100" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ABA 2: E-MAILS & ENTREGA */}
                <TabsContent value="email" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" /> Configurações de E-mail
                                </CardTitle>
                                <CardDescription className="font-light">Personalize os e-mails enviados pelo sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Título do Cabeçalho do E-mail</Label>
                                    <Input
                                        value={emailSettings.headerTitle}
                                        onChange={(e) => setEmailSettings({...emailSettings, headerTitle: e.target.value})}
                                        placeholder="Ex: Seu Escritório Contável"
                                        className="font-light h-11 border-border/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Texto do Rodapé do E-mail</Label>
                                    <Input
                                        value={emailSettings.footerText}
                                        onChange={(e) => setEmailSettings({...emailSettings, footerText: e.target.value})}
                                        placeholder="Ex: Atenciosamente, Equipe [Nome do Escritório]"
                                        className="font-light h-11 border-border/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Texto do Botão de Ação (se houver)</Label>
                                    <Input
                                        value={emailSettings.buttonText}
                                        onChange={(e) => setEmailSettings({...emailSettings, buttonText: e.target.value})}
                                        placeholder="Ex: Acessar Documento"
                                        className="font-light h-11 border-border/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">E-mail para Resposta (Reply-To)</Label>
                                    <Input
                                        type="email"
                                        value={emailSettings.replyToEmail}
                                        onChange={(e) => setEmailSettings({...emailSettings, replyToEmail: e.target.value})}
                                        placeholder="contato@seuescritorio.com.br"
                                        className="font-light h-11 border-border/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Assunto do E-mail de Entrega</Label>
                                    <Input
                                        value={emailSettings.deliveryEmailSubject}
                                        onChange={(e) => setEmailSettings({...emailSettings, deliveryEmailSubject: e.target.value})}
                                        placeholder="Seu documento está pronto!"
                                        className="font-light h-11 border-border/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Corpo do E-mail de Entrega</Label>
                                    <Textarea
                                        value={emailSettings.deliveryEmailBody}
                                        onChange={(e) => setEmailSettings({...emailSettings, deliveryEmailBody: e.target.value})}
                                        placeholder="Olá [Nome do Cliente], seu documento [Nome do Documento] está disponível para acesso."
                                        className="font-light border-border/50 rounded-xl min-h-[100px]"
                                    />
                                    <p className="text-[9px] text-muted-foreground px-1">
                                        Use <code>[Nome do Cliente]</code> e <code>[Nome do Documento]</code> para personalização automática.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSaveAll} disabled={isSaving} className="flex-1 rounded-xl h-12 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10">
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Salvar Configurações de E-mail
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>


                {/* ABA 3: INTELIGÊNCIA ARTIFICIAL */}
                <TabsContent value="ai" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <BrainCircuit className="h-5 w-5 text-primary" /> Motor de Inteligência Artificial
                                </CardTitle>
                                <CardDescription className="font-light">Configure as chaves e modelos para automação do escritório</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex gap-4">
                                    <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs text-amber-900 font-medium">Segurança da Chave API</p>
                                        <p className="text-[11px] text-amber-700 font-light leading-relaxed">
                                            Sua chave é salva localmente no seu navegador e não é compartilhada. Ela é necessária para:
                                        </p>
                                        <ul className="text-[10px] text-amber-700 list-disc list-inside mt-2 space-y-1">
                                            <li>Leitura automática de guias PDF</li>
                                            <li>Refino de textos de comunicados</li>
                                            <li>Geração de assuntos inteligentes</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest pl-1">
                                        OpenAI API Key
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="h-12 rounded-xl border-border/50 bg-muted/20 text-sm font-light transition-all focus:border-primary/20"
                                    />
                                    <p className="text-[9px] text-muted-foreground px-1">
                                        Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSaveAll} disabled={isSaving} className="flex-1 rounded-xl h-12 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10">
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Salvar Configurações de IA
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ABA 4: RESPONSÁVEIS TÉCNICOS */}
                <TabsContent value="technicians" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card lg:col-span-1 h-fit">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <Plus className="h-5 w-5 text-primary" /> {editingTechId ? 'Editar Responsável' : 'Novo Responsável'}
                                </CardTitle>
                                <CardDescription className="font-light">Gerencie os nomes que aparecem nos cadastros</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleAddTech} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Nome Completo</Label>
                                        <Input
                                            value={newTechName}
                                            onChange={(e) => setNewTechName(e.target.value)}
                                            placeholder="Ex: João da Silva"
                                            className="font-light h-11 border-border/50 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Departamento Correspondente</Label>
                                        <select
                                            value={newTechDept}
                                            onChange={(e) => setNewTechDept(e.target.value as Department)}
                                            className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                                        >
                                            <option value="dp">Departamento Pessoal</option>
                                            <option value="fiscal">Departamento Fiscal</option>
                                            <option value="contabil">Departamento Contábil</option>
                                            <option value="financeiro">Departamento Financeiro</option>
                                            <option value="qualidade">Departamento de Qualidade</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button type="submit" className="flex-1 rounded-xl h-11 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10 transition-all active:scale-95">
                                            {editingTechId ? <><Check className="mr-2 h-4 w-4" /> Atualizar</> : <><Plus className="mr-2 h-4 w-4" /> Cadastrar</>}
                                        </Button>
                                        {editingTechId && (
                                            <Button type="button" variant="ghost" onClick={() => { setEditingTechId(null); setNewTechName(''); }} className="rounded-xl h-11 px-4 text-xs font-light text-muted-foreground hover:text-foreground">
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(Object.keys(departmentLabels) as Department[]).map((dept) => {
                                    const deptTechs = technicians.filter(t => t.department === dept);
                                    return (
                                        <Card key={dept} className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                                            <CardHeader className="py-4 bg-muted/5 border-b border-border/30">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-xs uppercase tracking-[0.15em] font-medium text-primary/80">{departmentLabels[dept]}</CardTitle>
                                                    <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">{deptTechs.length}</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {techsLoading ? (
                                                    <div className="p-8 flex justify-center"><Loader2 className="h-4 w-4 animate-spin opacity-20" /></div>
                                                ) : deptTechs.length === 0 ? (
                                                    <div className="p-8 text-center text-xs text-muted-foreground font-light italic opacity-60">Nenhum responsável cadastrado</div>
                                                ) : (
                                                    <div className="divide-y divide-border/30">
                                                        {deptTechs.map((tech) => (
                                                            <div key={tech.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors group">
                                                                <span className="text-sm font-light text-foreground/80">{tech.name}</span>
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => startEditTech(tech)}
                                                                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all"
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => deleteTechnician(tech.id)}
                                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-all"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 5: MEU PERFIL */}
                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-primary" /> Configurações de Perfil
                                </CardTitle>
                                <CardDescription className="font-light">Altere seu nome de exibição e avatar no sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-center pb-6">
                                        <div className="h-24 w-24 rounded-full bg-primary/10 border-4 border-white shadow-xl flex items-center justify-center text-primary text-3xl font-black overflow-hidden">
                                            {profileAvatar ? (
                                                <img src={profileAvatar} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                profileName.charAt(0).toUpperCase() || "U"
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Nome de Exibição</Label>
                                        <Input
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            placeholder="Ex: Jefferson Administrador"
                                            className="font-light h-11 border-border/50 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">URL do Avatar (Foto)</Label>
                                        <Input
                                            value={profileAvatar}
                                            onChange={(e) => setProfileAvatar(e.target.value)}
                                            placeholder="https://exemplo.com/sua-foto.png"
                                            className="font-light h-11 border-border/50 rounded-xl"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            onClick={async () => {
                                                setIsSaving(true);
                                                try {
                                                    const { error } = await supabase.auth.updateUser({
                                                        data: { 
                                                            name: profileName,
                                                            avatar_url: profileAvatar
                                                        }
                                                    });
                                                    if (error) throw error;
                                                    toast.success('Perfil atualizado com sucesso!');
                                                } catch (err: any) {
                                                    toast.error('Erro ao atualizar perfil: ' + err.message);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }} 
                                            disabled={isSaving} 
                                            className="w-full rounded-xl h-12 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10"
                                        >
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Atualizar Meus Dados
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>


            </Tabs>
        </div>
    );
}
