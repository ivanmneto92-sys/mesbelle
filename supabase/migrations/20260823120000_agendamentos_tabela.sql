-- Tabela principal de agendamentos (visita, prova, retirada, ajuste, devolução).
-- Não existe tabela `alugueis` neste schema — reserva_id referencia
-- reservas_agenda (mesma tabela usada pela agenda do Acervo), que é o
-- registro real de "peça reservada por um período".
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo             TEXT        NOT NULL
                   CHECK (tipo IN ('visita','prova','retirada','ajuste','devolucao')),
  data_hora        TIMESTAMPTZ NOT NULL,
  duracao_minutos  INTEGER     NOT NULL DEFAULT 60,
  cliente_nome     TEXT        NOT NULL,
  cliente_email    TEXT,
  cliente_telefone TEXT,
  negocio_id       UUID        REFERENCES public.negocios(id)        ON DELETE SET NULL,
  reserva_id       UUID        REFERENCES public.reservas_agenda(id) ON DELETE SET NULL,
  vestido_id       UUID        REFERENCES public.vestidos(id)        ON DELETE SET NULL,
  funcionaria_id   UUID        REFERENCES auth.users(id)             ON DELETE SET NULL,
  observacoes      TEXT,
  criado_por       UUID        REFERENCES auth.users(id),
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora
  ON public.agendamentos (data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_funcionaria
  ON public.agendamentos (funcionaria_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_negocio
  ON public.agendamentos (negocio_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_reserva
  ON public.agendamentos (reserva_id);

CREATE OR REPLACE FUNCTION fn_agendamentos_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_agendamentos_atualizado_em ON public.agendamentos;
CREATE TRIGGER trg_agendamentos_atualizado_em
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION fn_agendamentos_set_atualizado_em();
