import React, { createContext, useContext, useEffect, useState } from 'react';
import { hexToHsl } from '@/lib/colors';

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
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_COLOR = '#E11D48'; // current primary
const DEFAULT_NAME = 'GestorPro';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [primaryColor, setPrimaryColor] = useState(() => {
        return localStorage.getItem('gestorpro_primary_color') || DEFAULT_COLOR;
    });

    const [sidebarColor, setSidebarColor] = useState(() => {
        return localStorage.getItem('gestorpro_sidebar_color') || '#000000';
    });

    const [logoUrl, setLogoUrl] = useState<string | null>(() => {
        return localStorage.getItem('gestorpro_logo_url') || '/favicon.png';
    });

    const [officeName, setOfficeName] = useState(() => {
        return localStorage.getItem('gestorpro_office_name') || DEFAULT_NAME;
    });

    useEffect(() => {
        localStorage.setItem('gestorpro_primary_color', primaryColor);
        const hsl = hexToHsl(primaryColor);
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
        document.documentElement.style.setProperty('--sidebar-primary', hsl);
        // Also set accent to follow primary
        document.documentElement.style.setProperty('--accent', hsl);
    }, [primaryColor]);

    useEffect(() => {
        localStorage.setItem('gestorpro_sidebar_color', sidebarColor);
        const hsl = hexToHsl(sidebarColor);
        document.documentElement.style.setProperty('--sidebar-background', hsl);

        // Calculate if text should be white or black based on sidebar background
        // (Simple heuristic: if it's dark, white text, if light, black text)
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
    }, [sidebarColor]);

    useEffect(() => {
        if (logoUrl) {
            localStorage.setItem('gestorpro_logo_url', logoUrl);
        } else {
            localStorage.removeItem('gestorpro_logo_url');
        }
    }, [logoUrl]);

    useEffect(() => {
        localStorage.setItem('gestorpro_office_name', officeName);
    }, [officeName]);

    const resetBranding = () => {
        setPrimaryColor(DEFAULT_COLOR);
        setSidebarColor('#000000');
        setLogoUrl('/favicon.png');
        setOfficeName(DEFAULT_NAME);
    };

    return (
        <BrandingContext.Provider value={{
            primaryColor,
            setPrimaryColor,
            sidebarColor,
            setSidebarColor,
            logoUrl,
            setLogoUrl,
            officeName,
            setOfficeName,
            resetBranding
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
