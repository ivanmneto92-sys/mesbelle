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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contratos: {
        Row: {
          assinatura_base64: string | null
          cpf_cliente: string
          created_at: string
          data_assinatura: string | null
          data_criacao: string
          data_evento: string
          id: string
          lead_id: string
          negocio_id: string | null
          nome_cliente: string
          numero: string
          status_assinatura: string
          termos_texto: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          assinatura_base64?: string | null
          cpf_cliente?: string
          created_at?: string
          data_assinatura?: string | null
          data_criacao?: string
          data_evento?: string
          id?: string
          lead_id: string
          negocio_id?: string | null
          nome_cliente: string
          numero: string
          status_assinatura?: string
          termos_texto?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          assinatura_base64?: string | null
          cpf_cliente?: string
          created_at?: string
          data_assinatura?: string | null
          data_criacao?: string
          data_evento?: string
          id?: string
          lead_id?: string
          negocio_id?: string | null
          nome_cliente?: string
          numero?: string
          status_assinatura?: string
          termos_texto?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cpf: string
          created_at: string
          criado_em: string
          data_evento: string
          email: string
          endereco: string
          enviado_comercial: boolean
          id: string
          nome: string
          notas_internas: string
          prova_data: string | null
          prova_hora: string | null
          status_funil: string
          telefone: string
          tipo_evento: string
          updated_at: string
          vendedor_responsavel: string
        }
        Insert: {
          cpf?: string
          created_at?: string
          criado_em?: string
          data_evento?: string
          email?: string
          endereco?: string
          enviado_comercial?: boolean
          id?: string
          nome: string
          notas_internas?: string
          prova_data?: string | null
          prova_hora?: string | null
          status_funil?: string
          telefone?: string
          tipo_evento?: string
          updated_at?: string
          vendedor_responsavel?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          criado_em?: string
          data_evento?: string
          email?: string
          endereco?: string
          enviado_comercial?: boolean
          id?: string
          nome?: string
          notas_internas?: string
          prova_data?: string | null
          prova_hora?: string | null
          status_funil?: string
          telefone?: string
          tipo_evento?: string
          updated_at?: string
          vendedor_responsavel?: string
        }
        Relationships: []
      }
      medidas: {
        Row: {
          altura: string
          busto: string
          cintura: string
          created_at: string
          lead_id: string
          manequim: string
          quadril: string
          salto: string | null
          updated_at: string
        }
        Insert: {
          altura?: string
          busto?: string
          cintura?: string
          created_at?: string
          lead_id: string
          manequim?: string
          quadril?: string
          salto?: string | null
          updated_at?: string
        }
        Update: {
          altura?: string
          busto?: string
          cintura?: string
          created_at?: string
          lead_id?: string
          manequim?: string
          quadril?: string
          salto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medidas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          cliente_cpf: string
          cliente_id: string
          cliente_nome: string
          created_at: string
          criado_em: string
          data_evento: string
          desconto: number
          id: string
          metodo_pagamento: string
          status_negociacao: string
          updated_at: string
          valor_negociado: number
          vestido_nome: string | null
        }
        Insert: {
          cliente_cpf?: string
          cliente_id: string
          cliente_nome: string
          created_at?: string
          criado_em?: string
          data_evento?: string
          desconto?: number
          id?: string
          metodo_pagamento?: string
          status_negociacao?: string
          updated_at?: string
          valor_negociado?: number
          vestido_nome?: string | null
        }
        Update: {
          cliente_cpf?: string
          cliente_id?: string
          cliente_nome?: string
          created_at?: string
          criado_em?: string
          data_evento?: string
          desconto?: number
          id?: string
          metodo_pagamento?: string
          status_negociacao?: string
          updated_at?: string
          valor_negociado?: number
          vestido_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string
          id: string
          nome: string
          percentual_comissao: number | null
          telefone: string | null
          tipo_contrato: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          percentual_comissao?: number | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          percentual_comissao?: number | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write_crm: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "socio"
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
      app_role: ["admin", "vendedor", "socio"],
    },
  },
} as const
