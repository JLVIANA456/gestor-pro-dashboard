
import { supabase } from "@/integrations/supabase/client";

export class ResendService {
  static async sendEmail({ 
    to, 
    subject, 
    html,
    reply_to,
    attachments
  }: { 
    to: string; 
    subject: string; 
    html: string;
    reply_to?: string;
    attachments?: { filename: string; content: string }[];
  }) {
    try {
      // Chamada via RPC (Função de Banco de Dados) para evitar CORS
      const { data, error } = await (supabase.rpc as any)('send_email_with_resend', {
        to_email: to,
        subject: subject,
        html_content: html
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Resend Error:', error);
      throw new Error(error.message || 'Erro ao enviar e-mail. Verifique se você rodou o script SQL no Supabase.');
    }
  }
}
