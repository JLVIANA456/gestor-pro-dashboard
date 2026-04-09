export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          ccm: string | null
          cnpj: string
          created_at: string
          email: string
          id: string
          ie: string | null
          nome_fantasia: string
          quadro_societario: Json
          razao_social: string
          regime_tributario: Database["public"]["Enums"]["tax_regime"]
          senha_prefeitura: string | null
          telefone: string
          is_active: boolean
          data_entrada: string
          data_saida: string | null
          updated_at: string
        }
        Insert: {
          ccm?: string | null
          cnpj: string
          created_at?: string
          email: string
          id?: string
          ie?: string | null
          nome_fantasia: string
          quadro_societario?: Json
          razao_social: string
          regime_tributario?: Database["public"]["Enums"]["tax_regime"]
          senha_prefeitura?: string | null
          telefone: string
          is_active?: boolean
          data_entrada?: string
          data_saida?: string | null
          updated_at?: string
        }
        Update: {
          ccm?: string | null
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          ie?: string | null
          nome_fantasia?: string
          quadro_societario?: Json
          razao_social?: string
          regime_tributario?: Database["public"]["Enums"]["tax_regime"]
          senha_prefeitura?: string | null
          telefone?: string
          is_active?: boolean
          data_entrada?: string
          data_saida?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profit_withdrawals: {
        Row: {
          id: string
          client_id: string
          partner_name: string
          partner_cpf: string
          withdrawal_date: string
          amount: number
          bank: string | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          partner_name: string
          partner_cpf: string
          withdrawal_date: string
          amount: number
          bank?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          partner_name?: string
          partner_cpf?: string
          withdrawal_date?: string
          amount?: number
          bank?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_withdrawals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      obligations: {
        Row: {
          id: string
          name: string
          type: Database["public"]["Enums"]["obligation_type"]
          department: string
          default_due_day: number
          is_user_editable: boolean
          alert_days: number[]
          alert_recipient_email: string
          periodicity: Database["public"]["Enums"]["obligation_periodicity"]
          is_active: boolean
          internal_note: string | null
          competency: string | null
          due_rule: Database["public"]["Enums"]["obligation_due_rule"]
          anticipate_on_weekend: boolean
          tax_regimes: string[]
          competency_rule: Database["public"]["Enums"]["obligation_competency_rule"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: Database["public"]["Enums"]["obligation_type"]
          department: string
          default_due_day: number
          is_user_editable?: boolean
          alert_days?: number[]
          alert_recipient_email: string
          periodicity?: Database["public"]["Enums"]["obligation_periodicity"]
          is_active?: boolean
          internal_note?: string | null
          competency?: string | null
          due_rule?: Database["public"]["Enums"]["obligation_due_rule"]
          anticipate_on_weekend?: boolean
          tax_regimes?: string[]
          competency_rule?: Database["public"]["Enums"]["obligation_competency_rule"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["obligation_type"]
          department?: string
          default_due_day?: number
          is_user_editable?: boolean
          alert_days?: number[]
          alert_recipient_email?: string
          periodicity?: Database["public"]["Enums"]["obligation_periodicity"]
          is_active?: boolean
          internal_note?: string | null
          competency?: string | null
          due_rule?: Database["public"]["Enums"]["obligation_due_rule"]
          anticipate_on_weekend?: boolean
          tax_regimes?: string[]
          competency_rule?: Database["public"]["Enums"]["obligation_competency_rule"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      obligation_alerts_sent: {
        Row: {
          id: string
          obligation_id: string | null
          alert_day: number
          competency: string
          sent_at: string
        }
        Insert: {
          id?: string
          obligation_id?: string | null
          alert_day: number
          competency: string
          sent_at?: string
        }
        Update: {
          id?: string
          obligation_id?: string | null
          alert_day?: number
          competency?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_alerts_sent_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          }
        ]
      }
      client_portal_users: {
        Row: {
          id: string
          user_id: string
          client_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      client_documents: {
        Row: {
          id: string
          client_id: string
          file_name: string
          file_url: string
          file_type: string | null
          category: string | null
          description: string | null
          month: string | null
          metadata: Json | null
          is_read: boolean
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          file_name: string
          file_url: string
          file_type?: string | null
          category?: string | null
          description?: string | null
          month?: string | null
          metadata?: Json | null
          is_read?: boolean
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          file_name?: string
          file_url?: string
          file_type?: string | null
          category?: string | null
          description?: string | null
          month?: string | null
          metadata?: Json | null
          is_read?: boolean
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      client_upload_tokens: {
        Row: {
          id: string
          client_id: string
          token: string
          expires_at: string
          max_uses: number
          used_count: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          token?: string
          expires_at: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          token?: string
          expires_at?: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_upload_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      custom_processes: {
        Row: {
          id: string
          name: string
          department: string
          step1_name: string | null
          step1_desc: string | null
          step1_day: number | null
          step2_name: string | null
          step2_desc: string | null
          step2_days: number | null
          step3_name: string | null
          step3_desc: string | null
          step3_day: number | null
          step4_name: string | null
          step4_desc: string | null
          step4_day: number | null
          manual_instrucoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          department?: string
          step1_name?: string | null
          step1_desc?: string | null
          step1_day?: number | null
          step2_name?: string | null
          step2_desc?: string | null
          step2_days?: number | null
          step3_name?: string | null
          step3_desc?: string | null
          step3_day?: number | null
          step4_name?: string | null
          step4_desc?: string | null
          step4_day?: number | null
          manual_instrucoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          department?: string
          step1_name?: string | null
          step1_desc?: string | null
          step1_day?: number | null
          step2_name?: string | null
          step2_desc?: string | null
          step2_days?: number | null
          step3_name?: string | null
          step3_desc?: string | null
          step3_day?: number | null
          step4_name?: string | null
          step4_desc?: string | null
          step4_day?: number | null
          manual_instrucoes?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tax_regime: "simples" | "presumido" | "real"
      obligation_type: "guia" | "imposto" | "tarefa operacional" | "obrigação acessória" | "envio de documento" | "conferência interna"
      obligation_periodicity: "mensal" | "trimestral" | "anual" | "eventual"
      obligation_due_rule: "dia fixo" | "regra especial"
      obligation_competency_rule: "previous_month" | "current_month" | "quarterly" | "annual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      tax_regime: ["simples", "presumido", "real"],
      obligation_type: ["guia", "imposto", "tarefa operacional", "obrigação acessória", "envio de documento", "conferência interna"],
      obligation_periodicity: ["mensal", "trimestral", "anual", "eventual"],
      obligation_due_rule: ["dia fixo", "regra especial"],
      obligation_competency_rule: ["previous_month", "current_month", "quarterly", "annual"]
    },
  },
} as const
