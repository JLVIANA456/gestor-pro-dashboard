import React, { createContext, useContext, useEffect, useState } from 'react';
import { hexToHsl } from '@/lib/colors';
import { BrandingService, EmailBranding } from '@/services/brandingService';
import { toast } from 'sonner';

interface BrandingContextType {
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    sidebarColor: string;
    setSidebarColor: (color: string) => void;
    logoUrl: string | null;
    setLogoUrl: (url: string | null) => void;
    officeName: string;
    setOfficeName: (name: string) => void;
    resetBranding: () => void;
    loading: boolean;
    ignoreSidebarTheme: boolean;
    setIgnoreSidebarTheme: (ignore: boolean) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_COLOR = '#eb2424';
const DEFAULT_NAME = 'JLVIANA Consultoria Contábil';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);
    const [sidebarColor, setSidebarColor] = useState('#ffffff');
    const [logoUrl, setLogoUrl] = useState<string | null>('/favicon.png');
    const [officeName, setOfficeName] = useState(DEFAULT_NAME);
    const [ignoreSidebarTheme, setIgnoreSidebarTheme] = useState(true);

    // Fetch initial branding from Supabase
    useEffect(() => {
        const loadBranding = async () => {
            try {
                const branding = await BrandingService.fetchBranding();
                setPrimaryColor(branding.primaryColor || DEFAULT_COLOR);
                setSidebarColor(branding.sidebarColor || '#ffffff');
                setLogoUrl(branding.logoUrl || '/favicon.png');
                setOfficeName(branding.officeName || DEFAULT_NAME);
            } catch (error) {
                console.error("Failed to load branding from Supabase:", error);
            } finally {
                setLoading(false);
            }
        };
        loadBranding();
    }, []);

    useEffect(() => {
        const hsl = hexToHsl(primaryColor);
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
        document.documentElement.style.setProperty('--sidebar-primary', hsl);
        document.documentElement.style.setProperty('--accent', hsl);
        
        // Update localStorage cache
        localStorage.setItem('jlconecta_primary_color', primaryColor);
    }, [primaryColor]);

    useEffect(() => {
        if (ignoreSidebarTheme) return;

        const hsl = hexToHsl(sidebarColor);
        document.documentElement.style.setProperty('--sidebar-background', hsl);

        const isLight = sidebarColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (isLight) {
            const r = parseInt(isLight[1], 16);
            const g = parseInt(isLight[2], 16);
            const b = parseInt(isLight[3], 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textHsl = brightness > 128 ? '0 0% 0%' : '0 0% 100%';
            document.documentElement.style.setProperty('--sidebar-foreground', textHsl);
            document.documentElement.style.setProperty('--sidebar-muted', brightness > 128 ? '0 0% 40%' : '0 0% 60%');
            document.documentElement.style.setProperty('--sidebar-border', brightness > 128 ? '0 0% 85%' : '0 0% 15%');
            document.documentElement.style.setProperty('--sidebar-accent', brightness > 128 ? '0 0% 90%' : '0 0% 12%');
        }
        localStorage.setItem('jlconecta_sidebar_color', sidebarColor);
    }, [sidebarColor, ignoreSidebarTheme]);

    useEffect(() => {
        if (logoUrl) {
            localStorage.setItem('jlconecta_logo_url', logoUrl);
        }
    }, [logoUrl]);

    useEffect(() => {
        localStorage.setItem('jlconecta_office_name', officeName);
    }, [officeName]);

    const handleSetPrimaryColor = async (color: string) => {
        setPrimaryColor(color);
        // Sync to Supabase
        try {
            const current = BrandingService.getBranding();
            await BrandingService.saveBranding({ ...current, primaryColor: color });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSetSidebarColor = async (color: string) => {
        setSidebarColor(color);
        try {
            const current = BrandingService.getBranding();
            await BrandingService.saveBranding({ ...current, sidebarColor: color });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSetLogoUrl = async (url: string | null) => {
        setLogoUrl(url);
        try {
            const current = BrandingService.getBranding();
            await BrandingService.saveBranding({ ...current, logoUrl: url || '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSetOfficeName = async (name: string) => {
        setOfficeName(name);
        try {
            const current = BrandingService.getBranding();
            await BrandingService.saveBranding({ ...current, officeName: name, companyName: name });
        } catch (e) {
            console.error(e);
        }
    };

    const resetBranding = async () => {
        setPrimaryColor(DEFAULT_COLOR);
        setSidebarColor('#ffffff');
        setLogoUrl('/favicon.png');
        setOfficeName(DEFAULT_NAME);
        
        try {
            await BrandingService.saveBranding({
                primaryColor: DEFAULT_COLOR,
                sidebarColor: '#ffffff',
                logoUrl: '/favicon.png',
                officeName: DEFAULT_NAME,
                companyName: DEFAULT_NAME,
                footerText: 'Este é um canal oficial de comunicação de seu escritório contábil.',
                headerTitle: 'Comunicado Oficial',
                buttonText: 'Acesse o Documento - Clicando Aqui',
                replyToEmail: ''
            });
            toast.success("Marca resetada no servidor!");
        } catch (e) {
            toast.error("Erro ao resetar no servidor");
        }
    };

    return (
        <BrandingContext.Provider value={{
            primaryColor,
            setPrimaryColor: handleSetPrimaryColor,
            sidebarColor,
            setSidebarColor: handleSetSidebarColor,
            logoUrl,
            setLogoUrl: handleSetLogoUrl,
            officeName,
            setOfficeName: handleSetOfficeName,
            resetBranding,
            loading,
            ignoreSidebarTheme,
            setIgnoreSidebarTheme
        }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
}
