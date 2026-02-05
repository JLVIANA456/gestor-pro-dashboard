import { useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Building2, Upload, RotateCcw, Check, Users, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechnicians, Department } from '@/hooks/useTechnicians';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
        resetBranding
    } = useBranding();

    const { technicians, loading, addTechnician, updateTechnician, deleteTechnician } = useTechnicians();

    const [localColor, setLocalColor] = useState(primaryColor);
    const [localSidebarColor, setLocalSidebarColor] = useState(sidebarColor);
    const [localName, setLocalName] = useState(officeName);
    const [localLogo, setLocalLogo] = useState(logoUrl || '');

    // Technician Form State
    const [newTechName, setNewTechName] = useState('');
    const [newTechDept, setNewTechDept] = useState<Department>('dp');
    const [editingTechId, setEditingTechId] = useState<string | null>(null);

    const handleSavePrimary = () => {
        setPrimaryColor(localColor);
        setSidebarColor(localSidebarColor);
        setOfficeName(localName);
        setLogoUrl(localLogo || null);
        toast.success('Configurações de marca personalizadas com sucesso!');
    };

    const handleReset = () => {
        resetBranding();
        setLocalColor('#E11D48');
        setLocalSidebarColor('#000000');
        setLocalName('GestorPro');
        setLocalLogo('/favicon.png');
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

    return (
        <div className="space-y-8 animate-slide-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-light tracking-tight text-foreground">Configurações do Sistema</h1>
                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">Gerencie a identidade visual e os responsáveis técnicos do seu escritório</p>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50 mb-8 inline-flex h-12 w-fit">
                    <TabsTrigger value="visual" className="rounded-xl px-8 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Palette className="w-4 h-4 mr-2" /> Identidade Visual
                    </TabsTrigger>
                    <TabsTrigger value="technicians" className="rounded-xl px-8 h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs uppercase tracking-widest font-light">
                        <Users className="w-4 h-4 mr-2" /> Responsáveis Técnicos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Settings Card */}
                        <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/30 bg-muted/5">
                                <CardTitle className="text-lg font-light tracking-wide flex items-center gap-3">
                                    <Palette className="h-5 w-5 text-primary" /> Marca & Cores
                                </CardTitle>
                                <CardDescription className="font-light">Ajuste as cores e logos para criar uma experiência única</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {/* Form controls (same as original) */}
                                <div className="space-y-2">
                                    <Label htmlFor="color" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Cor de Destaque (Principal)</Label>
                                    <div className="flex gap-4">
                                        <input type="color" id="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1" />
                                        <Input value={localColor} onChange={(e) => setLocalColor(e.target.value)} placeholder="#000000" className="font-mono font-light h-10 border-border/50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sidebarColor" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Cor do Menu Superior</Label>
                                    <div className="flex gap-4">
                                        <input type="color" id="sidebarColor" value={localSidebarColor} onChange={(e) => setLocalSidebarColor(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1" />
                                        <Input value={localSidebarColor} onChange={(e) => setLocalSidebarColor(e.target.value)} placeholder="#000000" className="font-mono font-light h-10 border-border/50" />
                                    </div>
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
                                    <Button onClick={handleSavePrimary} className="flex-1 rounded-xl h-11 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10">
                                        <Check className="mr-2 h-4 w-4 opacity-70" /> Salvar Alterações
                                    </Button>
                                    <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 border-border/50 font-light text-xs uppercase tracking-widest">
                                        <RotateCcw className="mr-2 h-4 w-4 opacity-70" /> Resetar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Card (same as original) */}
                        <Card className="border-border/50 shadow-card bg-muted/5 rounded-2xl overflow-hidden h-fit sticky top-6">
                            <CardHeader className="border-b border-border/30 bg-card/50">
                                <CardTitle className="text-lg font-light tracking-wide">Preview em Tempo Real</CardTitle>
                                <CardDescription className="font-light">Visualize como sua marca aparece no sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="py-12 flex items-center justify-center">
                                <div className="w-64 overflow-hidden rounded-xl border border-sidebar-border shadow-elevated" style={{ backgroundColor: localSidebarColor }}>
                                    <div className="flex h-20 items-center px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: localColor }}>
                                                {localLogo ? <img src={localLogo} alt="Logo" className="h-full w-full object-contain p-1" /> : <Building2 className="h-5 w-5 text-white" />}
                                            </div>
                                            <div>
                                                <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">{localName || 'GestorPro'}</h1>
                                                <p className="text-[10px] text-sidebar-muted uppercase tracking-wider font-medium">Escritório Contábil</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 px-3 py-6 opacity-60">
                                        <div className="h-10 rounded-lg bg-sidebar-accent/50 flex items-center px-4 gap-3">
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: localColor }} />
                                            <div className="h-2 w-20 bg-sidebar-muted/30 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="technicians" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Add/Edit Form */}
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

                        {/* List Area */}
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
                                                {deptTechs.length === 0 ? (
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
            </Tabs>
        </div>
    );
}

