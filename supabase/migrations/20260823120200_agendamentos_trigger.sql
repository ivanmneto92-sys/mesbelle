-- reservas_agenda não tinha vínculo com negocios — necessário para o
-- trigger buscar os dados da cliente (nome/e-mail/telefone) ao criar os
-- agendamentos automáticos. Só é preenchido pelo fluxo de venda do
-- funcionário (useCriarVenda); reservas criadas manualmente no Acervo
-- (lavanderia, ajuste, aluguéis avulsos) ficam com negocio_id nulo.
ALTER TABLE public.reservas_agenda
  ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_agenda_negocio
  ON public.reservas_agenda (negocio_id);

-- Quando uma peça é reservada para aluguel (reservas_agenda.status_reserva =
-- 'aluguel'), cria automaticamente dois agendamentos: retirada (09h no dia
-- de início) e devolução (18h no dia de fim). Não existe tabela `alugueis`
-- neste schema, então a origem real do "aluguel confirmado" é a própria
-- reserva — ela já nasce definitiva (sem estado pendente) quando criada
-- pelo fluxo de venda, daí o gatilho ser AFTER INSERT em vez de mudança de
-- status. Reservas de lavanderia/ajuste não geram agendamento de cliente.
CREATE OR REPLACE FUNCTION fn_criar_agendamentos_da_reserva()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nome  TEXT;
  v_cliente_email TEXT;
  v_cliente_tel   TEXT;
BEGIN
  IF NEW.status_reserva = 'aluguel' THEN
    SELECT n.cliente_nome, l.email, l.telefone
    INTO v_cliente_nome, v_cliente_email, v_cliente_tel
    FROM public.negocios n
    LEFT JOIN public.leads l ON l.id = n.cliente_id
    WHERE n.id = NEW.negocio_id
    LIMIT 1;

    v_cliente_nome := COALESCE(v_cliente_nome, 'Cliente');

    INSERT INTO public.agendamentos (
      tipo, data_hora, duracao_minutos,
      cliente_nome, cliente_email, cliente_telefone,
      negocio_id, reserva_id, vestido_id,
      funcionaria_id, criado_por
    ) VALUES (
      'retirada',
      (NEW.data_inicio::DATE + TIME '09:00:00') AT TIME ZONE 'America/Sao_Paulo',
      60,
      v_cliente_nome, v_cliente_email, v_cliente_tel,
      NEW.negocio_id, NEW.id, NEW.vestido_id,
      NULL, NULL
    );

    INSERT INTO public.agendamentos (
      tipo, data_hora, duracao_minutos,
      cliente_nome, cliente_email, cliente_telefone,
      negocio_id, reserva_id, vestido_id,
      funcionaria_id, criado_por
    ) VALUES (
      'devolucao',
      (NEW.data_fim::DATE + TIME '18:00:00') AT TIME ZONE 'America/Sao_Paulo',
      60,
      v_cliente_nome, v_cliente_email, v_cliente_tel,
      NEW.negocio_id, NEW.id, NEW.vestido_id,
      NULL, NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_reserva_cria_agendamentos ON public.reservas_agenda;
CREATE TRIGGER trg_reserva_cria_agendamentos
  AFTER INSERT ON public.reservas_agenda
  FOR EACH ROW
  EXECUTE FUNCTION fn_criar_agendamentos_da_reserva();
