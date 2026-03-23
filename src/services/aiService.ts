import { supabase } from "@/integrations/supabase/client";

export interface ExtractedResource {
    publicUrl: string;
    filePath: string;
}

export interface ExtractedGuideData {
  cnpj: string;
  companyName: string;
  value: string;
  dueDate: string;
  referenceMonth: string;
  type: string;
  hasInterests: boolean;
}

export class AiService {
  private static readonly STORAGE_KEY = 'gpt_api_key';

  static getApiKey(): string | null {
    const key = localStorage.getItem(this.STORAGE_KEY);
    if (!key || key.trim() === "") {
        return null;
    }
    return key;
  }

  static setApiKey(key: string): void {
    localStorage.setItem(this.STORAGE_KEY, key);
  }

  static async extractGuideData(file: File): Promise<ExtractedGuideData> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API Key não configurada. Clique no ícone de engrenagem para configurar.');
    }

    // Convert file to base64
    const base64 = await this.fileToBase64(file);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um Auditor Contábil IA especializado em guias de impostos brasileiras (DAS, FGTS, DARF, GARE, ISS, etc). 
            Sua missão é extrair dados com 100% de precisão para evitar erros de pagamento.
            
            Extraia em JSON puro:
            - cnpj: APENAS números do CNPJ ou CPF do contribuinte.
            - companyName: Nome da empresa ou Razão Social.
            - value: Valor total da guia (formato 0.00).
            - dueDate: Data de vencimento (formato ISO YYYY-MM-DD).
            - referenceMonth: Período de apuração / Competência (formato MM/YYYY).
            - type: Tipo Curto (Ex: DAS, FGTS, INSS, IRPJ, CSLL, ISS, ICMS).
            - hasInterests: true se houver multa ou juros calculados no valor total.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os dados desta guia de imposto." },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao processar com OpenAI');
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  static async uploadFile(file: File): Promise<ExtractedResource> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `guides/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('announcements')
      .upload(filePath, file);

    if (uploadError) {
      console.warn('Error uploading to announcements bucket:', uploadError);
      // If bucket doesn't exist, this might fail. In a real app we'd ensure bucket exists.
      throw new Error('Erro ao fazer upload do documento. Verifique se o bucket "announcements" existe no Supabase.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('announcements')
      .getPublicUrl(filePath);

    return { publicUrl, filePath };
  }

  static async refineAnnouncement(text: string, action: 'refine' | 'summarize' | 'subject' | 'simplify'): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API Key não configurada.');
    }

    const prompts = {
      refine: "Transforme este rascunho em um comunicado contábil ultra-profissional, polido e cordial. Mantenha as variáveis entre chaves como {{nome_fantasia}}. Use negrito (Markdown **) para pontos cruciais.",
      summarize: "Resuma este texto técnico em 3 pontos claros e simples para um cliente leigo entender o que precisa ser feito.",
      subject: "Sugira um assunto de e-mail curto e impactante para este comunicado. Retorne apenas o texto do assunto.",
      simplify: "Traduza o 'contabilês' deste texto para uma linguagem simples e clara, sem perder a precisão legal."
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um consultor contábil e especialista em comunicação corporativa. Sua tarefa é processar o texto do usuário conforme a instrução. Retorne apenas o texto processado, sem introduções ou explicações."
          },
          {
            role: "user",
            content: `${prompts[action]}\n\nTexto:\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na IA');
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }
}
