import { supabase } from "@/integrations/supabase/client";

export interface EmailBranding {
    primaryColor: string;
    headerTitle: string;
    footerText: string;
    companyName: string;
    buttonText: string;
    replyToEmail: string;
    deliveryEmailBody?: string;
    deliveryEmailSubject?: string;
    logoUrl?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    backgroundColor?: string;
    cardBackgroundColor?: string;
    textColor?: string;
    sidebarColor?: string;
    officeName?: string;
}

const DEFAULT_BRANDING: EmailBranding = {
    primaryColor: '#eb2424',
    headerTitle: 'Comunicado Oficial',
    footerText: 'Este é um canal oficial de comunicação de seu escritório contábil.',
    companyName: 'JLVIANA Consultoria Contábil',
    buttonText: 'Acesse o Documento - Clicando Aqui',
    replyToEmail: '',
    deliveryEmailBody: `Prezado(a) Cliente {{nome_empresa}},

Esta comunicação refere-se à empresa {{nome_empresa}}.

Em continuidade ao nosso compromisso em garantir que todas as obrigações contábeis, fiscais e legais estejam sempre em conformidade, encaminhamos em anexo: {{nome_imposto}}, referente à competência {{competencia}}.

{{link_documento}}

Vencimento: {{data_vencimento}}

Valor: R$ {{valor_guia}}

Atenciosamente,

{{companyName}}`,
    deliveryEmailSubject: 'Envio de Guia - {{nome_imposto}} - {{competencia}} - {{nome_empresa}}',
    logoUrl: '',
    buttonColor: '#eb2424',
    buttonTextColor: '#ffffff',
    backgroundColor: '#f8fafc',
    cardBackgroundColor: '#ffffff',
    textColor: '#334155',
    sidebarColor: '#000000',
    officeName: 'JLVIANA Consultoria Contábil'
};

const SINGLETON_ID = '00000000-0000-0000-0000-000000000000';

export const BrandingService = {
    async fetchBranding(): Promise<EmailBranding> {
        try {
            // Using 'as any' because the table was just created in migration and might not be in types yet
            const { data, error } = await (supabase as any)
                .from('branding_settings')
                .select('*')
                .eq('id', SINGLETON_ID)
                .single();

            if (error || !data) {
                console.warn("Could not fetch branding from Supabase, using defaults", error);
                return DEFAULT_BRANDING;
            }

            return {
                primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
                sidebarColor: data.sidebar_color || DEFAULT_BRANDING.sidebarColor,
                logoUrl: data.logo_url || DEFAULT_BRANDING.logoUrl,
                officeName: data.office_name || DEFAULT_BRANDING.officeName,
                companyName: data.company_name || DEFAULT_BRANDING.companyName,
                footerText: data.footer_text || DEFAULT_BRANDING.footerText,
                headerTitle: data.header_title || DEFAULT_BRANDING.headerTitle,
                buttonText: data.button_text || DEFAULT_BRANDING.buttonText,
                replyToEmail: data.reply_to_email || DEFAULT_BRANDING.replyToEmail,
                deliveryEmailBody: data.delivery_email_body || DEFAULT_BRANDING.deliveryEmailBody,
                deliveryEmailSubject: data.delivery_email_subject || DEFAULT_BRANDING.deliveryEmailSubject,
                buttonColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
                buttonTextColor: '#ffffff',
                backgroundColor: '#f8fafc',
                cardBackgroundColor: '#ffffff',
                textColor: '#334155'
            };
        } catch (e) {
            console.error("Error in fetchBranding:", e);
            return DEFAULT_BRANDING;
        }
    },

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

    async saveBranding(branding: EmailBranding) {
        // Cache locally first
        localStorage.setItem('email_branding', JSON.stringify(branding));
        
        const { error } = await (supabase as any)
            .from('branding_settings')
            .upsert({
                id: SINGLETON_ID,
                primary_color: branding.primaryColor,
                sidebar_color: branding.sidebarColor,
                logo_url: branding.logoUrl,
                office_name: branding.officeName || branding.companyName,
                company_name: branding.companyName,
                footer_text: branding.footerText,
                header_title: branding.headerTitle,
                button_text: branding.buttonText,
                reply_to_email: branding.replyToEmail,
                delivery_email_body: branding.deliveryEmailBody,
                delivery_email_subject: branding.deliveryEmailSubject,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error("Error saving branding to Supabase:", error);
            throw error;
        }
    },

    renderDeliveryEmail(branding: EmailBranding, clientName: string, types: string, formattedMonth: string, items: any[]): string {
        const subject = (branding.deliveryEmailSubject || 'Envio de Guia - {{nome_imposto}} - {{competencia}} - {{nome_empresa}}')
            .replace(/{{nome_imposto}}|{{impostos}}/g, types)
            .replace(/{{competencia}}|{{mes}}/g, formattedMonth)
            .replace(/{{nome_empresa}}|{{cliente}}/g, clientName);

        const bodyPrefix = (branding.deliveryEmailBody || 'Prezado(a) Cliente {{nome_empresa}},\nEsta comunicação refere-se à empresa {{nome_empresa}}.')
            .replace(/{{nome_empresa}}|{{cliente}}/g, clientName)
            .replace(/{{competencia}}|{{mes}}/g, formattedMonth)
            .replace(/{{nome_imposto}}|{{impostos}}/g, types)
            .replace(/{{link_documento}}/g, '')
            .replace(/{{JLVIANA Consultoria Contábil}}/g, branding.companyName || 'JLVIANA Consultoria Contábil')
            .replace(/{{companyName}}/g, branding.companyName || 'JLVIANA Consultoria Contábil');

        let itemsHtml = '';
        items.forEach(item => {
            const val = item.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const venc = item.due_date ? new Date(item.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '--';
            
            itemsHtml += `
                <div style="margin-bottom: 20px; padding: 20px; border-radius: 12px; background-color: ${branding.backgroundColor || '#f8fafc'}; border: 1px solid #e1e7ef; color: ${branding.textColor || '#334155'};">
                    <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: ${branding.buttonColor || branding.primaryColor || '#e70d0d'}; opacity: 0.6;">IMPOSTO</span>
                    <h3 style="margin: 5px 0; font-size: 18px; color: ${branding.textColor || '#0f172a'};">${item.type}</h3>
                    ${item.competency ? `<p style="margin: 0 0 10px 0; font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Competência: ${item.competency}</p>` : ''}
                    <div style="display: flex; gap: 20px; margin-top: 10px;">
                        <div style="display: inline-block; margin-right: 20px;">
                            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8;">VENCIMENTO</span>
                            <p style="margin: 2px 0; font-size: 14px; font-weight: bold;">${venc}</p>
                        </div>
                        <div style="display: inline-block;">
                            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8;">VALOR</span>
                            <p style="margin: 2px 0; font-size: 14px; font-weight: bold; color: #16a34a;">${val}</p>
                        </div>
                    </div>
                    ${item.file_url ? `
                    <div style="margin-top: 15px;">
                        <a href="${item.file_url}" style="display: inline-block; background-color: ${branding.buttonColor || branding.primaryColor || '#e70d0d'}; color: ${branding.buttonTextColor || '#ffffff'}; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: bold;">Visualizar Guia PDF</a>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: ${branding.textColor || '#334155'}; background-color: ${branding.backgroundColor || '#f8fafc'}; padding: 40px 20px;">
                <div style="text-align: center; padding-bottom: 30px;">
                    ${branding.logoUrl && branding.logoUrl !== '/favicon.png' ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-height: 80px; margin-bottom: 10px;">` : `<h1 style="color: ${branding.primaryColor || '#e70d0d'}; margin: 0;">${branding.companyName}</h1>`}
                </div>
                <div style="padding: 40px; border-radius: 20px; background-color: ${branding.cardBackgroundColor || '#ffffff'}; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="font-weight: 300; font-size: 24px; margin-bottom: 5px; color: ${branding.primaryColor || '#e70d0d'};">Olá!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; white-space: pre-wrap;">${bodyPrefix}</p>

                    ${itemsHtml}

                    <div style="margin-top: 30px; padding: 20px; background-color: ${branding.backgroundColor || '#f8fafc'}; border-radius: 15px; font-size: 12px; color: #64748b; border: 1px solid #e2e8f0;">
                        <p style="margin: 0;"><strong>Dica:</strong> Evite multas e juros efetuando o pagamento até a data de vencimento. Em caso de dúvidas, entre em contato com nosso suporte.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 30px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${branding.companyName}. Todos os direitos reservados.</p>
                    <p style="margin: 5px 0 0 0;">${branding.footerText}</p>
                </div>
            </div>
        `;

        return html;
    }
};
