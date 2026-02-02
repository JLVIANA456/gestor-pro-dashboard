import { useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Building2, Upload, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';

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

    const [localColor, setLocalColor] = useState(primaryColor);
    const [localSidebarColor, setLocalSidebarColor] = useState(sidebarColor);
    const [localName, setLocalName] = useState(officeName);
    const [localLogo, setLocalLogo] = useState(logoUrl || '');

    const handleSave = () => {
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
        setLocalLogo('');
        toast.info('Configurações resetadas para o padrão.');
    };

    return (
        <div className="space-y-8 animate-slide-in-up">
            <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">Customização de Marca</h1>
                <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Personalize a identidade visual e fortaleça sua marca no sistema</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Settings Card */}
                <Card className="border-border/50 shadow-card rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/30 bg-muted/5">
                        <CardTitle className="flex items-center gap-3 text-lg font-light tracking-wide">
                            <div className="p-2 rounded-xl bg-primary/5">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            Identidade Visual
                        </CardTitle>
                        <CardDescription className="font-light">
                            Ajuste as cores e logos para criar uma experiência única
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Primary Color Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="color" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Cor de Destaque (Principal)</Label>
                            <div className="flex gap-4">
                                <input
                                    type="color"
                                    id="color"
                                    value={localColor}
                                    onChange={(e) => setLocalColor(e.target.value)}
                                    className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1"
                                />
                                <Input
                                    value={localColor}
                                    onChange={(e) => setLocalColor(e.target.value)}
                                    placeholder="#000000"
                                    className="font-mono font-light h-10"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-light">
                                Esta cor será aplicada em botões, ícones ativos e elementos de destaque.
                            </p>
                        </div>

                        {/* Sidebar Color Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="sidebarColor" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Cor do Menu Superior</Label>
                            <div className="flex gap-4">
                                <input
                                    type="color"
                                    id="sidebarColor"
                                    value={localSidebarColor}
                                    onChange={(e) => setLocalSidebarColor(e.target.value)}
                                    className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1"
                                />
                                <Input
                                    value={localSidebarColor}
                                    onChange={(e) => setLocalSidebarColor(e.target.value)}
                                    placeholder="#000000"
                                    className="font-mono font-light h-10"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-light">
                                Personalize a cor de fundo da barra de navegação superior.
                            </p>
                        </div>

                        {/* Office Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Nome do Escritório</Label>
                            <div className="flex gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30">
                                    <Building2 className="h-4 w-4 text-muted-foreground/60" />
                                </div>
                                <Input
                                    id="name"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    placeholder="Ex: Contabilidade Silva"
                                    className="font-light h-10"
                                />
                            </div>
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <Label htmlFor="logo" className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">Link da Logo (URL)</Label>
                            <div className="flex gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30">
                                    <Upload className="h-4 w-4 text-muted-foreground/60" />
                                </div>
                                <Input
                                    id="logo"
                                    value={localLogo}
                                    onChange={(e) => setLocalLogo(e.target.value)}
                                    placeholder="https://exemplo.com/sua-logo.png"
                                    className="font-light h-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button onClick={handleSave} className="flex-1 rounded-xl h-11 font-light text-xs uppercase tracking-widest shadow-sm shadow-primary/10">
                                <Check className="mr-2 h-4 w-4 opacity-70" />
                                Salvar
                            </Button>
                            <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 border-border/50 font-light text-xs uppercase tracking-widest">
                                <RotateCcw className="mr-2 h-4 w-4 opacity-70" />
                                Resetar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="border-border/50 shadow-card bg-muted/5 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/30 bg-card/50">
                        <CardTitle className="text-lg font-light tracking-wide">Preview em Tempo Real</CardTitle>
                        <CardDescription className="font-light">
                            Visualize como sua marca aparece no sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-10">
                        <div className="w-64 overflow-hidden rounded-xl border border-sidebar-border shadow-elevated"
                            style={{ backgroundColor: localSidebarColor }}>
                            <div className="flex h-20 items-center px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
                                        style={{ backgroundColor: localColor }}>
                                        {localLogo ? (
                                            <img src={localLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                                        ) : (
                                            <Building2 className="h-5 w-5 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">
                                            {localName || 'GestorPro'}
                                        </h1>
                                        <p className="text-[10px] text-sidebar-muted uppercase tracking-wider font-medium">
                                            Escritório Contábil
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1 px-3 py-6 opacity-60">
                                <div className="h-10 rounded-lg bg-sidebar-accent/50 flex items-center px-4 gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: localColor }} />
                                    <div className="h-2 w-20 bg-sidebar-muted/30 rounded" />
                                </div>
                                <div className="h-10 rounded-lg flex items-center px-4 gap-3">
                                    <div className="h-4 w-4 bg-sidebar-muted/30 rounded-full" />
                                    <div className="h-2 w-24 bg-sidebar-muted/30 rounded" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
