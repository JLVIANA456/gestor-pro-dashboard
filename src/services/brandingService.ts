
export interface EmailBranding {
    primaryColor: string;
    headerTitle: string;
    footerText: string;
    companyName: string;
    buttonText: string;
    replyToEmail: string;
}

const DEFAULT_BRANDING: EmailBranding = {
    primaryColor: '#EA4335',
    headerTitle: 'Comunicado Oficial',
    footerText: 'Este é um canal oficial de comunicação de seu escritório contábil.',
    companyName: 'Gestor Pro',
    buttonText: 'Acessar Documento',
    replyToEmail: ''
};

export const BrandingService = {
    getBranding(): EmailBranding {
        const saved = localStorage.getItem('email_branding');
        if (saved) {
            try {
                return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
            } catch (e) {
                return DEFAULT_BRANDING;
            }
        }
        return DEFAULT_BRANDING;
    },

    setBranding(branding: EmailBranding) {
        localStorage.setItem('email_branding', JSON.stringify(branding));
    }
};
