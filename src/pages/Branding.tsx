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
        <div className="space-y-6 animate-slide-in-up">
            <div>
                <h1 className="text-2xl font-light text-foreground">Customização de Marca</h1>
                <p className="text-muted-foreground">Personalize a identidade visual do seu escritório</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Settings Card */}
                <Card className="border-border shadow-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            Identidade Visual
                        </CardTitle>
                        <CardDescription>
                            Ajuste as cores e logos do sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Primary Color Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="color">Cor de Destaque (Principal)</Label>
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
                                    className="font-mono"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Esta cor será aplicada em botões, ícones ativos e elementos de destaque.
                            </p>
                        </div>

                        {/* Sidebar Color Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="sidebarColor">Cor do Menu Lateral (Sidebar)</Label>
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
                                    className="font-mono"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Esta cor define o fundo do menu de navegação lateral.
                            </p>
                        </div>

                        {/* Office Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Escritório</Label>
                            <div className="flex gap-2">
                                <Building2 className="h-4 w-4 mt-3 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    placeholder="Ex: Contabilidade Silva"
                                />
                            </div>
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <Label htmlFor="logo">Link da Logo (URL)</Label>
                            <div className="flex gap-2">
                                <Upload className="h-4 w-4 mt-3 text-muted-foreground" />
                                <Input
                                    id="logo"
                                    value={localLogo}
                                    onChange={(e) => setLocalLogo(e.target.value)}
                                    placeholder="https://exemplo.com/sua-logo.png"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Recomendado: Logo com fundo transparente (PNG/SVG) e proporção quadrada ou retangular pequena.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button onClick={handleSave} className="flex-1">
                                <Check className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Resetar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="border-border shadow-card bg-muted/30">
                    <CardHeader>
                        <CardTitle>Pré-visualização</CardTitle>
                        <CardDescription>
                            Veja como sua marca aparecerá no sidebar
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
