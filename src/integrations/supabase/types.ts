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
      agendamentos: {
        Row: {
          atualizado_em: string
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          criado_em: string
          criado_por: string | null
          data_hora: string
          duracao_minutos: number
          funcionaria_id: string | null
          id: string
          lead_id: string | null
          negocio_id: string | null
          observacoes: string | null
          reserva_id: string | null
          status: string
          tipo: string
          vestido_id: string | null
        }
        Insert: {
          atualizado_em?: string
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          criado_em?: string
          criado_por?: string | null
          data_hora: string
          duracao_minutos?: number
          funcionaria_id?: string | null
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          observacoes?: string | null
          reserva_id?: string | null
          status?: string
          tipo: string
          vestido_id?: string | null
        }
        Update: {
          atualizado_em?: string
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          criado_em?: string
          criado_por?: string | null
          data_hora?: string
          duracao_minutos?: number
          funcionaria_id?: string | null
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          observacoes?: string | null
          reserva_id?: string | null
          status?: string
          tipo?: string
          vestido_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_vestido_id_fkey"
            columns: ["vestido_id"]
            isOneToOne: false
            referencedRelation: "vestidos"
            referencedColumns: ["id"]
          },
        ]
      }
      alugueis_logistica: {
        Row: {
          assinatura_base64: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          data_assinatura: string | null
          data_retorno: string
          data_saida: string
          endereco_entrega: string
          id: string
          ip_assinatura: string | null
          status_logistica: string
          updated_at: string
          user_agent_assinatura: string | null
          vestido_nome: string
        }
        Insert: {
          assinatura_base64?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          data_assinatura?: string | null
          data_retorno: string
          data_saida: string
          endereco_entrega?: string
          id?: string
          ip_assinatura?: string | null
          status_logistica?: string
          updated_at?: string
          user_agent_assinatura?: string | null
          vestido_nome?: string
        }
        Update: {
          assinatura_base64?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          data_assinatura?: string | null
          data_retorno?: string
          data_saida?: string
          endereco_entrega?: string
          id?: string
          ip_assinatura?: string | null
          status_logistica?: string
          updated_at?: string
          user_agent_assinatura?: string | null
          vestido_nome?: string
        }
        Relationships: []
      }
      ativos_patrimonio: {
        Row: {
          categoria: string
          created_at: string
          data_compra: string
          id: string
          nome: string
          percentual_desagio: number
          valor_original: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data_compra: string
          id?: string
          nome: string
          percentual_desagio?: number
          valor_original?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_compra?: string
          id?: string
          nome?: string
          percentual_desagio?: number
          valor_original?: number
        }
        Relationships: []
      }
      avaliacoes_clientes: {
        Row: {
          comentario: string | null
          created_at: string
          data: string
          funcionario_id: string | null
          id: string
          ip_hash: string | null
          nota: number
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          data: string
          funcionario_id?: string | null
          id?: string
          ip_hash?: string | null
          nota: number
        }
        Update: {
          comentario?: string | null
          created_at?: string
          data?: string
          funcionario_id?: string | null
          id?: string
          ip_hash?: string | null
          nota?: number
        }
        Relationships: []
      }
      config_financeiro: {
        Row: {
          credito_parcelado: number
          credito_vista: number
          debito: number
          id: number
          iss: number
          simples_nacional: number
          updated_at: string
        }
        Insert: {
          credito_parcelado?: number
          credito_vista?: number
          debito?: number
          id?: number
          iss?: number
          simples_nacional?: number
          updated_at?: string
        }
        Update: {
          credito_parcelado?: number
          credito_vista?: number
          debito?: number
          id?: number
          iss?: number
          simples_nacional?: number
          updated_at?: string
        }
        Relationships: []
      }
      config_socios: {
        Row: {
          id: number
          multiplicador: number
          updated_at: string
        }
        Insert: {
          id?: number
          multiplicador?: number
          updated_at?: string
        }
        Update: {
          id?: number
          multiplicador?: number
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          assinatura_base64: string | null
          cpf_cliente: string
          created_at: string
          data_assinatura: string | null
          data_criacao: string
          data_evento: string
          email_cliente: string
          email_enviado_em: string | null
          id: string
          ip_assinatura: string | null
          lead_id: string
          negocio_id: string | null
          nome_cliente: string
          numero: string
          signing_token: string | null
          status_assinatura: string
          termos_texto: string
          token_expires_at: string | null
          updated_at: string
          user_agent_assinatura: string | null
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          assinatura_base64?: string | null
          cpf_cliente?: string
          created_at?: string
          data_assinatura?: string | null
          data_criacao?: string
          data_evento?: string
          email_cliente?: string
          email_enviado_em?: string | null
          id?: string
          ip_assinatura?: string | null
          lead_id: string
          negocio_id?: string | null
          nome_cliente: string
          numero: string
          signing_token?: string | null
          status_assinatura?: string
          termos_texto?: string
          token_expires_at?: string | null
          updated_at?: string
          user_agent_assinatura?: string | null
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          assinatura_base64?: string | null
          cpf_cliente?: string
          created_at?: string
          data_assinatura?: string | null
          data_criacao?: string
          data_evento?: string
          email_cliente?: string
          email_enviado_em?: string | null
          id?: string
          ip_assinatura?: string | null
          lead_id?: string
          negocio_id?: string | null
          nome_cliente?: string
          numero?: string
          signing_token?: string | null
          status_assinatura?: string
          termos_texto?: string
          token_expires_at?: string | null
          updated_at?: string
          user_agent_assinatura?: string | null
          valor_total?: number
          vendedor_id?: string | null
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
      etapas_producao: {
        Row: {
          created_at: string
          id: string
          is_concluido: boolean
          nome_etapa: string
          ordem: number
          producao_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_concluido?: boolean
          nome_etapa: string
          ordem?: number
          producao_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_concluido?: boolean
          nome_etapa?: string
          ordem?: number
          producao_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          email: string | null
          id: string
          nome: string
          percentual_comissao: number
          telefone: string | null
          tipo_contrato: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          percentual_comissao?: number
          telefone?: string | null
          tipo_contrato?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          percentual_comissao?: number
          telefone?: string | null
          tipo_contrato?: string
          updated_at?: string
        }
        Relationships: []
      }
      jornada_aluguel: {
        Row: {
          created_at: string
          id: string
          is_concluido: boolean
          nome_etapa: string
          ordem: number
          reserva_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_concluido?: boolean
          nome_etapa: string
          ordem?: number
          reserva_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_concluido?: boolean
          nome_etapa?: string
          ordem?: number
          reserva_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornada_aluguel_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_agenda"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          atendido_por: string | null
          cpf: string
          created_at: string
          criado_em: string
          criado_por: string | null
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
          atendido_por?: string | null
          cpf?: string
          created_at?: string
          criado_em?: string
          criado_por?: string | null
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
          atendido_por?: string | null
          cpf?: string
          created_at?: string
          criado_em?: string
          criado_por?: string | null
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
      meta_breakdown_capabilities: {
        Row: {
          ad_account_id: string
          detalhes: Json | null
          flexible_format_asset_type: boolean | null
          image_asset: boolean | null
          media_asset_url: boolean | null
          media_type: boolean | null
          tested_at: string
          video_asset: boolean | null
        }
        Insert: {
          ad_account_id: string
          detalhes?: Json | null
          flexible_format_asset_type?: boolean | null
          image_asset?: boolean | null
          media_asset_url?: boolean | null
          media_type?: boolean | null
          tested_at?: string
          video_asset?: boolean | null
        }
        Update: {
          ad_account_id?: string
          detalhes?: Json | null
          flexible_format_asset_type?: boolean | null
          image_asset?: boolean | null
          media_asset_url?: boolean | null
          media_type?: boolean | null
          tested_at?: string
          video_asset?: boolean | null
        }
        Relationships: []
      }
      negocios: {
        Row: {
          bandeira_cartao: string | null
          cliente_cpf: string
          cliente_email: string | null
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          criado_em: string
          data_evento: string
          desconto: number
          descricao_primeiro_aluguel: string | null
          id: string
          metodo_pagamento: string
          observacoes: string | null
          parcelas: number
          status_negociacao: string
          tipo_negocio: string
          updated_at: string
          valor_negociado: number
          vendedor_id: string | null
          vestido_id_novo: string | null
          vestido_nome: string | null
        }
        Insert: {
          bandeira_cartao?: string | null
          cliente_cpf?: string
          cliente_email?: string | null
          cliente_id: string
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          criado_em?: string
          data_evento?: string
          desconto?: number
          descricao_primeiro_aluguel?: string | null
          id?: string
          metodo_pagamento?: string
          observacoes?: string | null
          parcelas?: number
          status_negociacao?: string
          tipo_negocio?: string
          updated_at?: string
          valor_negociado?: number
          vendedor_id?: string | null
          vestido_id_novo?: string | null
          vestido_nome?: string | null
        }
        Update: {
          bandeira_cartao?: string | null
          cliente_cpf?: string
          cliente_email?: string | null
          cliente_id?: string
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          criado_em?: string
          data_evento?: string
          desconto?: number
          descricao_primeiro_aluguel?: string | null
          id?: string
          metodo_pagamento?: string
          observacoes?: string | null
          parcelas?: number
          status_negociacao?: string
          tipo_negocio?: string
          updated_at?: string
          valor_negociado?: number
          vendedor_id?: string | null
          vestido_id_novo?: string | null
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
          {
            foreignKeyName: "negocios_vestido_id_novo_fkey"
            columns: ["vestido_id_novo"]
            isOneToOne: false
            referencedRelation: "vestidos"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_attempts: {
        Row: {
          criado_em: string
          email: string
          id: string
        }
        Insert: {
          criado_em?: string
          email: string
          id?: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      permissoes_config: {
        Row: {
          id: number
          socio: Json
          updated_at: string
          vendedor: Json
        }
        Insert: {
          id?: number
          socio: Json
          updated_at?: string
          vendedor: Json
        }
        Update: {
          id?: number
          socio?: Json
          updated_at?: string
          vendedor?: Json
        }
        Relationships: []
      }
      producoes: {
        Row: {
          ajuste_solicitado: boolean
          cliente_nome: string
          created_at: string
          data_prazo: string | null
          data_prova: string | null
          id: string
          negocio_id: string | null
          notas_tecnicas: string
          ref_imagens_urls: string[]
          status_geral: string
          titulo_vestido: string
          updated_at: string
          vestido_id: string | null
        }
        Insert: {
          ajuste_solicitado?: boolean
          cliente_nome?: string
          created_at?: string
          data_prazo?: string | null
          data_prova?: string | null
          id?: string
          negocio_id?: string | null
          notas_tecnicas?: string
          ref_imagens_urls?: string[]
          status_geral?: string
          titulo_vestido?: string
          updated_at?: string
          vestido_id?: string | null
        }
        Update: {
          ajuste_solicitado?: boolean
          cliente_nome?: string
          created_at?: string
          data_prazo?: string | null
          data_prova?: string | null
          id?: string
          negocio_id?: string | null
          notas_tecnicas?: string
          ref_imagens_urls?: string[]
          status_geral?: string
          titulo_vestido?: string
          updated_at?: string
          vestido_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producoes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producoes_vestido_id_fkey"
            columns: ["vestido_id"]
            isOneToOne: false
            referencedRelation: "vestidos"
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
      reservas_agenda: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          negocio_id: string | null
          status_reserva: string
          vestido_id: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          negocio_id?: string | null
          status_reserva?: string
          vestido_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          negocio_id?: string | null
          status_reserva?: string
          vestido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_agenda_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_empresa: {
        Row: {
          ativo: boolean
          created_at: string
          data_expiracao: string | null
          id: string
          nome: string
          percentual_participacao: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_expiracao?: string | null
          id?: string
          nome: string
          percentual_participacao?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_expiracao?: string | null
          id?: string
          nome?: string
          percentual_participacao?: number
          updated_at?: string
        }
        Relationships: []
      }
      taxas_cartao: {
        Row: {
          bandeira: string
          id: string
          parcelas: number
          taxa_percentual: number
          updated_at: string
        }
        Insert: {
          bandeira: string
          id?: string
          parcelas: number
          taxa_percentual: number
          updated_at?: string
        }
        Update: {
          bandeira?: string
          id?: string
          parcelas?: number
          taxa_percentual?: number
          updated_at?: string
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          lead_id: string | null
          negocio_id: string | null
          observacoes: string | null
          status: string
          tipo: string
          tipo_custo: string | null
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data: string
          descricao?: string
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          observacoes?: string | null
          status?: string
          tipo: string
          tipo_custo?: string | null
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          observacoes?: string | null
          status?: string
          tipo?: string
          tipo_custo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
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
      vestidos: {
        Row: {
          categoria_peca: string
          comprimento: string
          cor: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string
          imagens_urls: string[]
          is_consignado: boolean
          nome: string
          preco_aluguel: number
          preco_venda: number
          qtd_total_locacoes: number
          sku: string | null
          status: string
          tamanho: string
          updated_at: string
        }
        Insert: {
          categoria_peca?: string
          comprimento?: string
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string
          imagens_urls?: string[]
          is_consignado?: boolean
          nome: string
          preco_aluguel?: number
          preco_venda?: number
          qtd_total_locacoes?: number
          sku?: string | null
          status?: string
          tamanho?: string
          updated_at?: string
        }
        Update: {
          categoria_peca?: string
          comprimento?: string
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string
          imagens_urls?: string[]
          is_consignado?: boolean
          nome?: string
          preco_aluguel?: number
          preco_venda?: number
          qtd_total_locacoes?: number
          sku?: string | null
          status?: string
          tamanho?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_webhook_eventos: {
        Row: {
          recebido_em: string
          wamid: string
        }
        Insert: {
          recebido_em?: string
          wamid: string
        }
        Update: {
          recebido_em?: string
          wamid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _client_ip_from_request: { Args: never; Returns: string }
      _get_meta_credentials: {
        Args: never
        Returns: {
          access_token: string
          ad_account_id: string
        }[]
      }
      assinar_contrato_publico: {
        Args: {
          _assinatura: string
          _ip: string
          _token: string
          _user_agent: string
        }
        Returns: Json
      }
      can_read_crm: { Args: { _user_id: string }; Returns: boolean }
      can_read_socios: { Args: { _user_id: string }; Returns: boolean }
      can_write_crm: { Args: { _user_id: string }; Returns: boolean }
      fn_criar_vestido_primeiro_aluguel: {
        Args: {
          p_categoria: string
          p_comprimento: string
          p_cor: string
          p_descricao: string
          p_nome: string
          p_preco_aluguel: number
          p_tamanho: string
        }
        Returns: string
      }
      fn_faixa_comissao: {
        Args: { v_faturamento_mes: number }
        Returns: number
      }
      get_contrato_by_token: {
        Args: { _token: string }
        Returns: {
          assinatura_base64: string
          cpf_cliente: string
          data_assinatura: string
          data_evento: string
          id: string
          nome_cliente: string
          numero: string
          status_assinatura: string
          termos_texto: string
          token_expires_at: string
          valor_total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_funcionario: {
        Args: { _funcionario_email: string; _user_id: string }
        Returns: boolean
      }
      listar_vendedores_publico: {
        Args: never
        Returns: {
          id: string
          nome: string
        }[]
      }
      submeter_avaliacao_publica: {
        Args: { _comentario: string; _funcionario_id: string; _nota: number }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
