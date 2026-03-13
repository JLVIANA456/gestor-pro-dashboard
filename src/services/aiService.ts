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
    return localStorage.getItem(this.STORAGE_KEY);
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
            content: "Você é um assistente contábil especializado em ler guias de impostos (DAS, FGTS, DARF, etc). Extraia os dados em formato JSON puro, sem markdown. Campos: cnpj (apenas números), companyName, value (formato 0.00), dueDate (ISO), referenceMonth (MM/YYYY), type (DAS, FGTS, etc), hasInterests (boolean)."
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
